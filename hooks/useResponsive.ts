"use client";

import { useEffect, useState } from "react";

export function useResponsive(breakpoint: number = 768): boolean {
  const [isResponsive, setIsResponsive] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsResponsive(window.innerWidth <= breakpoint);
    };

    checkScreen();

    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, [breakpoint]);

  return isResponsive;
}
