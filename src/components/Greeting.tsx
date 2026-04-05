"use client";

import { useEffect, useState } from "react";

interface GreetingProps {
  userName?: string;
  role?: string;
}

export function Greeting({ userName, role }: GreetingProps) {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
        {greeting}, {userName || "User"}
      </h1>
      <p className="text-slate-400 text-sm mt-1">
        Logged in as <span className="font-bold text-accent uppercase tracking-widest text-[10px]">{role?.replace("_", " ")}</span>
      </p>
    </div>
  );
}
