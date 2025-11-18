import { Button } from "./button";
import { Checkbox } from "./Checkbox";
import { useState } from "react";

interface Dialogue {
  description?: string;
  heading: string;
  content: {
    line: string;
    points?: string[];
  }[];
  checkboxContent?: string;
  buttonText: string;
  onClose?: () => void;
  onOpen?: () => void;
  buttonOnClick: () => void;
  onCheckboxChange?: (checked: boolean) => void;
}

export const Dialogue = (props: Dialogue) => {
  const [isChecked, setIsChecked] = useState(false);
  return (
    <div className="shadow-md flex flex-col gap-[20px] w-full  max-h-[90vh] rounded-[20px] py-[36px] px-[20px] bg-[#F7F7F7]">
      <div className="text-[24px] font-bold text-center mb-[24px] flex-shrink-0">
        {props.heading}
      </div>
      {props.description && (
        <div className="text-[16px] font-medium text-[#333333] ">
          {props.description}
        </div>
      )}
      <div className="text-[#333333] overflow-y-auto overflow-x-hidden pr-2 max-h-[600px]">
        <ol className="list-decimal list-outside pl-5 space-y-3">
          {props.content.map((item, idx) => {
            return (
              <li className="text-[16px] font-medium" key={idx}>
                {item.line}
                {item.points && item.points.length > 0 && (
                  <ul className="list-[lower-alpha] list-outside pl-4 mt-1 space-y-2">
                    {item.points.map((point, pointIdx) => (
                      <li key={pointIdx} className="text-[16px] font-medium">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {props.checkboxContent && (
        <div className="flex-shrink-0 mt-[24px]">
          <Checkbox
            label={props.checkboxContent}
            checked={isChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsChecked(checked);
              props.onCheckboxChange?.(checked);
            }}
            className="text-[#333333]"
          />
        </div>
      )}
      <div className="flex flex-col gap-[12px] flex-shrink-0 mt-[24px]">
        <Button
          type="solid"
          size="medium"
          text={props.buttonText}
          disabled={props.checkboxContent ? !isChecked : false}
          onClick={props.buttonOnClick}
        />
        <Button
          type="ghost"
          disabled={false}
          text="Close"
          size="medium"
          onClick={props.onClose || (() => {})}
        />
      </div>
    </div>
  );
};
