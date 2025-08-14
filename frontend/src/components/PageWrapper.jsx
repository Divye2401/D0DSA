// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="min-h-screen"
  >
    {children}
  </motion.div>
);
