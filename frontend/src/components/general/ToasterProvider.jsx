import { Toaster } from "react-hot-toast";

/**
 * ToasterProvider component with custom theme configuration
 */
export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        top: "22px", // Move toasts down from the top
      }}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1a1a1a",
          width: "165px",
          height: "60px",
          color: "#f0f0f0",
          border: "1px solid #3c3c3c",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#00b8a3",
            secondary: "#1a1a1a",
          },
        },
        error: {
          iconTheme: {
            primary: "#ff375f",
            secondary: "#1a1a1a",
          },
        },
        loading: {
          iconTheme: {
            primary: "#ffa116",
            secondary: "#1a1a1a",
          },
        },
      }}
    />
  );
}
