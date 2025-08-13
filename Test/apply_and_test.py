# deploy_and_repair.py
# An intelligent script to autonomously run a multi-step Terraform deployment,
# specifically designed to resolve state file race conditions and corruptions.

import os
import subprocess
import sys

# --- Configuration ---
# The root directory of the Terraform project.
TERRAFORM_ROOT = r"C:\schv1\terraform"
# The specific resource that is causing the state corruption.
TARGETED_RESOURCE = "google_project_service_identity.gcs_service_agent"

# --- Helper Functions ---

def print_color(text, color_code):
    """Prints text in a given color."""
    # ANSI color codes
    print(f"\033[{color_code}m{text}\033[0m")

def run_terraform_command(command, working_dir):
    """Runs a Terraform command and handles its output."""
    print_color(f"\n--> Executing: terraform {command}", "96") # Cyan
    print_color(f"    In directory: {working_dir}", "90") # Grey
    try:
        # We use Popen to stream output in real-time, which is better for long-running commands.
        process = subprocess.Popen(
            ["terraform"] + command.split(), # Split the command string into a list of arguments
            cwd=working_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace'
        )

        # Read and print output line by line
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())

        return_code = process.poll()
        return return_code

    except FileNotFoundError:
        print_color("Error: 'terraform' command not found. Is Terraform installed and in your system's PATH?", "91")
        return -1
    except Exception as e:
        print_color(f"An unexpected error occurred while running Terraform: {e}", "91")
        return -1

def run_targeted_apply(target, working_dir):
    """Runs a targeted terraform apply to repair a specific resource."""
    print_color(f"\n--- Step 1: Attempting Targeted State Repair ---", "93") # Yellow
    print(f"This step will focus exclusively on resource '{target}' to repair the state file.")

    # For a targeted apply, we need to handle the interactive prompt.
    # We will run 'plan' first to see the changes, then 'apply' with auto-approve.
    plan_command = f"plan -target={target} -out=tf.plan"
    if run_terraform_command(plan_command, working_dir) != 0:
        print_color("Targeted plan failed. Cannot proceed with repair.", "91")
        return False

    apply_command = "apply -auto-approve tf.plan"
    if run_terraform_command(apply_command, working_dir) != 0:
        print_color("Targeted apply failed. The state could not be repaired.", "91")
        return False

    print_color("Targeted apply successful. State should now be repaired.", "92") # Green
    return True

def run_full_apply(working_dir):
    """Runs a full terraform apply to deploy the remaining infrastructure."""
    print_color("\n--- Step 2: Attempting Full Deployment ---", "93")
    print("Now that the state is clean, applying the full configuration.")

    # We can run apply directly with auto-approve for the final step.
    if run_terraform_command("apply -auto-approve", working_dir) != 0:
        print_color("Full deployment failed. Please review the errors above.", "91")
        return False

    print_color("\nSUCCESS: Infrastructure has been fully deployed.", "92")
    return True

# --- Main Execution ---

def main():
    """Main function to orchestrate the repair and deploy process."""
    print_color("--- Starting Autonomous Terraform Deployment & Repair ---", "95") # Magenta

    if not os.path.isdir(TERRAFORM_ROOT):
        print_color(f"Error: Project directory not found at '{TERRAFORM_ROOT}'", "91")
        sys.exit(1)

    # Step 1: Run the targeted apply to fix the state.
    if not run_targeted_apply(TARGETED_RESOURCE, TERRAFORM_ROOT):
        sys.exit(1)

    # Step 2: Run the full apply to deploy everything else.
    if not run_full_apply(TERRAFORM_ROOT):
        sys.exit(1)

    print_color("\nDeployment process completed successfully!", "92")


if __name__ == "__main__":
    main()
