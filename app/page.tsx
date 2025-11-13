'use client'

import { Button } from "@/components/button";
import { Checkbox } from "@/components/ui/Checkbox";

import Image from "next/image";
import { useState } from "react";




export default function Home() {


  const [agree,setAgree]=useState(false)





  return (
    <>
    <div className="flex flex-col justify-center items-center pt-4">
      <Button disabled={false} text="Button" size="small" type="solid"/>
    
    </div>
    


    <div className="p-10">

      <Checkbox

      label="Accept Terms & Conditions"
      checked={agree}
      onChange={(e) => setAgree(e.target.checked)}
      
      />
        <p className="mt-4">Checked: {agree.toString()}</p>


    </div>


    <Checkbox error label="Error State" />

    <Checkbox label="Focus Test" />
    <Checkbox label="Hover Test" />







    
    </>
  );
}
