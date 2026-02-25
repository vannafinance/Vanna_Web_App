import { Button } from "./button";
import { Checkbox } from "./Checkbox";
import { useState } from "react";
import { motion } from "framer-motion";
  buttonDisabled?: boolean;
  loadingMessage?: string;
}

export const Dialogue = (props: Dialogue) => {
  const { isDark } = useTheme();
  const [isChecked, setIsChecked] = useState(false);
  
  return (
    <motion.div 
      className={`shadow-md flex flex-col gap-[20px] w-full max-h-[90vh] rounded-[20px] py-[36px] px-[20px] ${
        isDark ? "bg-[#111111]" : "bg-[#F7F7F7]"
      }`}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div 
        className={`text-[24px] font-bold text-center mb-[24px] flex-shrink-0 ${
          isDark ? "text-white" : ""
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {props.heading}
      </motion.div>

      {props.description && (
        <motion.div 
          className={`text-[16px] font-medium ${
            isDark ? "text-white" : "text-[#333333]"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {props.description}
        </motion.div>
      )}
      
      <div className={`overflow-y-auto overflow-x-hidden pr-2 max-h-[600px] ${
        isDark ? "text-white" : "text-[#333333]"
      }`}>
        <ol className="list-decimal list-outside pl-5 space-y-3">
          {props.content.map((item, idx) => {
            return (
              <motion.li
                className="text-[16px] font-medium"
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
              >
                {item.line}
                {item.points && item.points.length > 0 && (
                  <ul className="list-[lower-alpha] list-outside pl-4 mt-1 space-y-2">
                    {item.points.map((point, pointIdx) => (
                      <motion.li
                        key={pointIdx}
                        className="text-[16px] font-medium"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: 0.25 + idx * 0.05 + pointIdx * 0.03,
                        }}
                      >
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.li>
            );
          })}
        </ol>
      </div>

      {props.checkboxContent && (
        <motion.div
          className="flex-shrink-0 mt-[24px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.3 + props.content.length * 0.05,
          }}
        >
          <Checkbox
            label={props.checkboxContent}
            checked={isChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsChecked(checked);
              props.onCheckboxChange?.(checked);
            }}
            className={isDark ? "text-white" : "text-[#333333]"}
          />
        </motion.div>
      )}

          disabled={props.buttonDisabled || (props.checkboxContent ? !isChecked : false)}
          onClick={props.buttonOnClick}
        />
        <Button
          type="ghost"
          disabled={false}
          text="Close"
          size="medium"
          onClick={props.onClose || (() => {})}
        />
      </motion.div>
    </motion.div>
  );
};
