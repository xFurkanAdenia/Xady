import { Foo } from "dummy"; export const foo: Foo; declare module "dummy" { export type Foo = string; }
