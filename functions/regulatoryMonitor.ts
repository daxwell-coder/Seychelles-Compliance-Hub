 * 5. The new hash is then stored for the next run.
 */
export const checkRegulatoryChanges = functions
  .runWith({ // Using v1 SDK syntax as per package.json
    memory: "1GiB", // Use GiB for consistency with GCP resource definitions
    timeoutSeconds: 120, // Puppeteer can be slow to start
  })
  .pubsub.topic("regulatory-monitor-topic") // Correctly subscribe to the topic managed by Terraform
  .onPublish(async (message, context) => {
    functions.logger.info(
      `Starting regulatory website check, triggered by messageId: ${context.eventId}`
    );

    // TODO: Implement Puppeteer logic, hashing, Firestore I/O, and alerting.

    functions.logger.info("Regulatory website check completed.");
    return null;
  });

