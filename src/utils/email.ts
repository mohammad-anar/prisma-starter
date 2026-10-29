import { EmailProvider, sendEmail } from "./email/emailProvider.js";

export { EmailProvider, sendEmail };

export const emailHelper = {
  ...EmailProvider,
};

export default emailHelper;
