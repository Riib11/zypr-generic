import backend from "../backend/BackendA";
import frontend from "../frontend/Frontend1";
import { Exp } from "../language/Language1";

export const editor = () => frontend({ case: 'var', dat: { label: "x" } }, backend())