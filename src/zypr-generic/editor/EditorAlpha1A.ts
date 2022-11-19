import backend from "../backend/BackendA";
import frontend from "../frontend/Frontend1";
import { grammar } from "../language/LanguageAlpha";

export const editor = () =>
    frontend({ backend: backend({ grammar }) })