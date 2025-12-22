import React from "react";
import { Loader as LoaderIcon } from "lucide-react";

const Loader = ({ className = "" }) => (
  <LoaderIcon className={`animate-spin ${className}`} />
);

export default Loader;
