"use client"


import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio, RadioGroup } from "@/components/ui/RadioButton";
import ToggleButton from "@/components/ui/Toogle";
import Image from "next/image";
import { useState } from "react";
import { Popup } from "@/components/ui/popup";

export default function Home() {

  const [ischecked,setIscheckd]=useState(false)


  return (
    <>
    
    <Popup buttonOnClick={()=>{}} buttonText="Close Position" closeButtonText="Cancel" description="Are you sure you want to close this position? This action will lock in your current P&L and cannot be undone." icon="/assets/exclamation.png"/>

    </>

  );
}
