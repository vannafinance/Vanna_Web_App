'use client'

import { Button } from "@/components/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Radio, RadioGroup } from "@/components/ui/Radio";

import Image from "next/image";
import { useState } from "react";




export default function Home() {


  const [agree, setAgree] = useState(false)

  const [gender, setGender] = useState("male");






  return (
    <>

      {/* /////////////////////

      Button test 

    //////////////////////
     */}
      <div className="flex flex-col justify-center items-center pt-4">
        <Button disabled={false} text="Button" size="small" type="solid" />

      </div>

      {/* /////////////////////

      Checkbox test 

    ////////////////////// */}

      <div>
        <Checkbox label="Accept Terms & Conditions" />

      </div>



      {/* /////////////////////

      Radion box  

    ////////////////////// */}

      <div>

        <RadioGroup
          name="gender"
          value={gender}
          onChange={setGender}
          error={false}
        >
          <Radio label="Male" value="male" />
          <Radio label="Female" value="female" />
          <Radio label="Other" value="other" />
        </RadioGroup>

      </div>








    </>
  );
}
