import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeLabelProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  value,
  width = 1.5,
  height = 40,
  displayValue = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize: 11,
          margin: 2,
        });
      } catch (err) {
        console.error("Failed to render barcode:", err);
      }
    }
  }, [value, width, height, displayValue]);

  return <svg ref={svgRef} className="max-w-full h-auto mx-auto" />;
};
export default BarcodeLabel;
