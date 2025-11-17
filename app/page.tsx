"use client"


import { Button } from "@/components/button";
import { Dropdown } from "@/components/dropdown";
import { Navbar } from "@/components/navbar";
import { dropdownItems, navbarItems } from "@/lib/constants";
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
