"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStartups = exports.uploadStartupsImage = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = __importDefault(require("../lib/logger"));
const uploadStartupsImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startupId } = req.params;
    const { imageUrl } = req.body;
    if (!imageUrl) {
        logger_1.default.error("Image url is invalid or empty");
        res.status(404).json({ error: "Image url is empty " });
        return;
    }
    //upload the image
    try {
        yield prisma_1.prisma.startups.update({
            data: {
                imageUrl: imageUrl,
            },
            where: {
                id: startupId,
            },
        });
        logger_1.default.info("Image uploaded for startup id ", { startupId });
        res.status(201).json({ msg: "Image uplaoded successfully" });
    }
    catch (error) {
        res.status(404).json({ msg: "Error to uplaod the image" });
        logger_1.default.error("Problem to upload the image", {
            error
        });
    }
});
exports.uploadStartupsImage = uploadStartupsImage;
const getAllStartups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //upload the image
    try {
        const startups = yield prisma_1.prisma.startups.findMany({
            where: {
                OR: [
                    { imageUrl: null },
                    { imageUrl: "" }
                ]
            },
            select: {
                id: true,
                name: true,
            },
        });
        res.status(201).json({ startups: startups });
    }
    catch (error) {
        res.status(404).json({ msg: "Error to fetch all startups" });
        logger_1.default.error("Error to fetch all startups", {
            error
        });
    }
});
exports.getAllStartups = getAllStartups;
//# sourceMappingURL=uploader.js.map