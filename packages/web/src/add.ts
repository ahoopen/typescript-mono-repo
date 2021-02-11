import { multiplyByTwo } from "@ahoopen/utils";

export const add = (a: number, b: number) => {
  multiplyByTwo(a);
  return a + b;
};
