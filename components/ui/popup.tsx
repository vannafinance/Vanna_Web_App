import Image from "next/image"
import { Button } from "./button"

interface Popup {
    icon:string,
    description:string
    buttonText?:string
    buttonOnClick:()=>void
    closeButtonText?:string
}

export const Popup = (props:Popup)=>{
    return <div className="shadow-md w-[336px] rounded-[16px] py-[20px] px-[16px] flex flex-col justify-center items-center gap-[16px] ">
       <div className="rounded-[26px] p-[12px] bg-[#FFEEEE]">
        <Image src={props.icon} alt={props.icon} width={20} height={21.81} />
        </div> 
        <div className="text-center text-[14px] font-medium">
            {props.description}
        </div>
        <div className="w-full flex gap-[16px]">
          
            <Button disabled={false} size="medium" type="ghost" text={props.closeButtonText?props.closeButtonText:"Close"}/>
            {props.buttonText &&  <Button disabled={false} size="medium" type="solid" text={props.buttonText} onClick={props.buttonOnClick}/>}
        </div>
    </div>
}