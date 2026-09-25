/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request } from "express";
import { JwtPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
