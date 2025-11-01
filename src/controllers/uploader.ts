import { type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import logger from "../lib/logger";
export const uploadStartupsImage = async (req: Request, res: Response) => {
  const { startupId } = req.params;
  const { imageUrl } = req.body;
  console.log(imageUrl);
  if(!imageUrl){
    logger.error("Image url is invalid or empty")
    res.status(404).json({ error: "Image url is empty " });
    return;
  }
  console.log(startupId)
  //upload the image
  try {
    await prisma.startups.update({
      data: {
        imageUrl: imageUrl,
      },
      where: {
        id: startupId,
      },
    });
    logger.info("Image uploaded for startup id ", {startupId});
    res.status(201).json({ msg: "Image uplaoded successfully" });
  } catch (error:any) {
    res.status(404).json({ msg: "Error to uplaod the image" });
    logger.error("Problem to upload the image", {
        error
    });
  }
};
export const getAllStartups = async (req: Request, res: Response) => {
  //upload the image
  try {
    const startups: { id: string; name: string }[] =
      await prisma.startups.findMany({
        where:{
            imageUrl:null
        },
        select: {
          id: true,
          name: true,
        },
      });
    res.status(201).json({ startups: startups });
  } catch (error:any) {
    res.status(404).json({ msg: "Error to fetch all startups" });
    logger.error("Error to fetch all startups", {
        error
    });
  }
};
