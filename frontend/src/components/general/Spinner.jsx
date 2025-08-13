import { ClipLoader } from "react-spinners";

export default function Spinner({ size = 16, color = "#ffffff" }) {
  return <ClipLoader size={size} color={color} />;
}
