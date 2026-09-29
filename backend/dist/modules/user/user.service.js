"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("../../config/env");
const user_repository_1 = __importDefault(require("../../db/model/user/user.repository"));
const error_1 = require("../../utils/error");
const hash_1 = require("../../utils/hash");
const mail_1 = require("../../utils/mail");
const otp_1 = require("../../utils/otp");
const token_1 = require("../../utils/token");
const user_entity_1 = require("./entity/user.entity");
const mongoose_1 = require("mongoose");
const user_enums_1 = require("./entity/user.enums");
const creation_repository_1 = __importDefault(require("../../db/model/creation/creation.repository"));
class UserService {
    async register(registerDTO) {
        // check email existence
        const userExist = await user_repository_1.default.findOne({ email: registerDTO.email });
        if (userExist) {
            throw new error_1.ConflictException("email already exists");
        }
        // hash password
        const hash = await (0, hash_1.HashPassword)(registerDTO.password);
        // generate otp and otp expiry
        const otp = (0, otp_1.generateOTP)();
        const otpExpiry = (0, otp_1.generateExpiryDate)(5 * 60 * 1000);
        // prepare data
        const user = new user_entity_1.User();
        user.name = registerDTO.name;
        user.email = registerDTO.email;
        user.password = hash;
        user.agent = user_enums_1.AGENT.local;
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.isVerified = false;
        await Promise.all([
            // save into database
            user_repository_1.default.create(user),
            // send email
            (0, mail_1.sendMail)({
                from: `MagicNova <${env_1.envConfig.nodemailerEmail}>`,
                to: registerDTO.email,
                subject: "Email Verification",
                html: `<p>Your OTP to verify registered email is <b>${otp}</b></p><p>This OTP will expire in 5 minutes</p>`
            })
        ]);
    }
    async verifyEmail(verifyEmailDTO) {
        // get user by email
        const user = await user_repository_1.default.findOne({ email: verifyEmailDTO.email });
        if (!user) {
            throw new error_1.NotFoundException("user not found");
        }
        // check if already verified
        if (user.isVerified) {
            throw new error_1.ConflictException("email is already verified");
        }
        // check otp
        if (verifyEmailDTO.otp !== user.otp) {
            throw new error_1.UnAuthorizedException("invalid otp");
        }
        // check otp expiry
        if (Number(user.otpExpiry) < Date.now()) {
            throw new error_1.ForbiddenException("expired otp");
        }
        // update user
        user.isVerified = true;
        user.otp = "";
        user.otpExpiry = new Date();
        // save into database
        await user_repository_1.default.save(user);
    }
    async login(loginDTO) {
        // check email existence
        const user = await user_repository_1.default.findOne({ email: loginDTO.email });
        if (!user) {
            throw new error_1.UnAuthorizedException("invalid credentials");
        }
        // verify password
        const isMatch = await (0, hash_1.VerifyPassword)(loginDTO.password, user.password);
        if (!isMatch) {
            throw new error_1.UnAuthorizedException("invalid credentials");
        }
        // check verification
        if (!user.isVerified) {
            throw new error_1.UnAuthorizedException("please verify your email");
        }
        // generate token
        const payload = { _id: user._id, name: user.name, email: user.email };
        const token = (0, token_1.generateToken)(payload, { expiresIn: "7d" });
        // return token to controller
        return token;
    }
    async resendOTP(resendOTPDTO) {
        // generate otp and otp expiry
        const otp = (0, otp_1.generateOTP)();
        const otpExpiry = (0, otp_1.generateExpiryDate)(5 * 60 * 1000);
        // get user by email and update
        const user = await user_repository_1.default.findOneAndUpdate({ email: resendOTPDTO.email }, { otp, otpExpiry });
        if (!user) {
            throw new error_1.NotFoundException("user not found");
        }
        // send email
        await (0, mail_1.sendMail)({
            from: `MagicNova <${env_1.envConfig.nodemailerEmail}>`,
            to: resendOTPDTO.email,
            subject: "New OTP Sent",
            html: `<p>Your new OTP is <b>${otp}</b></p><p>This OTP will expire in 5 minutes</p>`
        });
    }
    async googleLogin(googleLoginDTO) {
        // integrate google client
        const client = new google_auth_library_1.OAuth2Client(env_1.envConfig.googleClientId);
        // verify idToken
        const ticket = await client.verifyIdToken({ idToken: googleLoginDTO.idToken });
        // get payload from ticket
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.name) {
            throw new error_1.BadRequestException("invalid google id token");
        }
        const { name, email } = payload;
        // check user existence
        const user = await user_repository_1.default.findOne({ email });
        let userId = user?.id;
        if (!user) {
            const createdUser = await user_repository_1.default.save({
                _id: userId,
                name,
                email,
                password: null,
                agent: user_enums_1.AGENT.google,
                isVerified: true
            });
            userId = createdUser._id;
        }
        const localPayload = { _id: new mongoose_1.Types.ObjectId(userId), name, email };
        // generate token
        const token = (0, token_1.generateToken)(localPayload, { expiresIn: "7d" });
        // return token to controller
        return token;
    }
    async resetPassword(resetPasswordDTO) {
        // check user existence
        const user = await user_repository_1.default.findOne({ email: resetPasswordDTO.email });
        if (!user) {
            throw new error_1.NotFoundException("user not found");
        }
        // check otp and otp expiry
        if (resetPasswordDTO.otp !== user.otp) {
            throw new error_1.UnAuthorizedException("invalid otp");
        }
        if (Number(user.otpExpiry) < Date.now()) {
            throw new error_1.ForbiddenException("expired otp");
        }
        // hash password
        const hash = await (0, hash_1.HashPassword)(resetPasswordDTO.newPassword);
        // update user 
        user.password = hash;
        user.otp = "";
        user.otpExpiry = new Date();
        // save into db
        await user_repository_1.default.save(user);
    }
    async getUserCreations(user) {
        // get user creations
        const creations = await creation_repository_1.default.find({ userId: user._id });
        // return creations
        return creations;
    }
    async toggleLikeCreation(user, creationId) {
        // get creation
        const creation = await creation_repository_1.default.findById(creationId);
        if (!creation) {
            throw new error_1.NotFoundException("creation not found");
        }
        // check if creation is published
        if (!creation.publish) {
            throw new error_1.ForbiddenException("creation is not published");
        }
        // toggle like
        let message;
        if (creation.likes.includes(user._id)) {
            const index = creation.likes.indexOf(user._id);
            creation.likes.splice(index, 1);
            message = "creation unliked successfully";
        }
        else {
            creation.likes.push(user._id);
            message = "creation liked successfully";
        }
        // save into db
        await creation_repository_1.default.save(creation);
        // return message
        return message;
    }
}
exports.default = new UserService();
