"use client"


import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio, RadioGroup } from "@/components/ui/RadioButton";
import ToggleButton from "@/components/ui/Toogle";
import Image from "next/image";
import { useState } from "react";

export default function Home() {

  const [ischecked,setIscheckd]=useState(false)


  return (
    <>
    
    <div className="flex flex-col justify-center items-center pt-4">
      hello main
    </div>

    <div>
    <Checkbox />

    </div>
    
    <div>

      <RadioGroup name="sanu">
        <Radio/>
      </RadioGroup>
    
    </div>

    <div>
    <ToggleButton onToggle={(value) => console.log("State:", value)} />

    </div>



    </>

  );
}
