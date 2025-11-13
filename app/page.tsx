import { Button } from "@/components/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center pt-4">
      <Button disabled={false} text="Button" size="small" type="solid"/>
    </div>
  );
}
