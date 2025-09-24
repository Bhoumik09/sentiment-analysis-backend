import { Request, Response } from "express";
import { loginBodyType, signUpBodyType } from "../types/zod/types";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { secretKey } from "../lib/constants";

export const login = async (req: Request, res: Response) => {
  const { email, password }: loginBodyType = req.body;
  //check if email exists in the db
  try {
    const isEmailPresent: {
      id: string;
      password: string;
      roleId: number;
    } | null = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, roleId: true },
    });
    if (!isEmailPresent) {
      logger.error("Email Provided is not registered", {
        email,
      });
      res.status(404).json({ error: "Email Provided is not registered" });
      return;
    }
    //check if password correct
    const isPasswordMatching = await bcryptjs.compare(
      password,
      isEmailPresent.password
    );
    if (!isPasswordMatching) {
      logger.error("Password provided is incorrect", {
        email,
      });
      res.status(404).json({ error: "Password provided is incorrect" });
      return;
    }
    //generate the jwt token
    const payload: {
      userInfo: {
        id: string;
        roleId: number;
      };
    } = {
      userInfo: {
        id: isEmailPresent.id,
        roleId: isEmailPresent.roleId,
      },
    };
    const token = jwt.sign(payload, secretKey!, { expiresIn: "1h" });
    //send token to frontend
    logger.info("Loggin Success", {
      userId: isEmailPresent.id,
    });
    res.status(200).json({ msg: "Login SuccessFull", token: token });
  } catch (e: any) {
    logger.error("There was an error in login", {
      email,
      id: req.user.id,
      error: e.message,
    });
    res
      .status(500)
      .json({ error: "An unknown server error occured while logging in" });
  }
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, name }: signUpBodyType = req.body;
  //check if email exists in the db
  try {
    const isEmailPresent: {
      id: string;
    } | null = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (isEmailPresent) {
      logger.error("Email Provided is already registered", {
        email,
      });
      res.status(404).json({ error: "Email Provided is already registered" });
      return;
    }
    //encrypt the password
    const encryptedPassword = await bcryptjs.hash(password, 8);
    //register new user
    await prisma.user.create({
      data: {
        password: encryptedPassword,
        name,
        email,
      },
    });
    //send token to frontend
    res.status(200).json({ msg: "User Signed Up SuccessFully" });
  } catch (e: any) {
    logger.error("There was an error in login", {
      email,
      id: req.user.id,
      error: e.message,
    });
    res
      .status(500)
      .json({ error: "An unknown server error occured while logging in" });
  }
};
export const fetchUser = async (req: Request, res: Response) => {
  try {
    //fetch User Data
    const userData: {
      id: string;
      email: string;
      name: string;
    } | null = await prisma.user.findUnique({
      where: { id: req.user.id },
      omit: { password: true },
    });
    if (!userData) {
      logger.error("UserId Provided is invalid", {
        id: req.user.id,
        roleId: req.user.roleId,
      });
      res.status(404).json({ error: "Invalid User Id" });
      return;
    }

    //send userData to frontend
    res
      .status(200)
      .json({ msg: "User Data fetched Successfully", userInfo: userData });
  } catch (e: any) {
    logger.error("There was an error in login", {
      id: req.user.id,
      error: e.message,
    });
    res
      .status(500)
      .json({ error: "An unknown server error occured while logging in" });
  }
};
