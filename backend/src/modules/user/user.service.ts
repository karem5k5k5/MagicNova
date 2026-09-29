import { OAuth2Client } from "google-auth-library";
import { envConfig } from "../../config/env";
import userRepository from "../../db/model/user/user.repository";
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnAuthorizedException } from "../../utils/error";
import { HashPassword, VerifyPassword } from "../../utils/hash";
import { sendMail } from "../../utils/mail";
import { generateExpiryDate, generateOTP } from "../../utils/otp";
import { generateToken } from "../../utils/token";
import { IUser, User } from "./entity/user.entity";
import { IJwtPayload } from "../../utils/common/interface";
import { Types } from "mongoose";
import { GoogleLoginDTO, LoginDTO, RegisterDTO, ResendOTPDTO, ResetPasswordDTO, VerifyEmailDTO } from "./user.dto";
import { AGENT } from "./entity/user.enums";
import creationRepository from "../../db/model/creation/creation.repository";

class UserService {

    async register(registerDTO: RegisterDTO) {
        // check email existence
        const userExist = await userRepository.findOne({ email: registerDTO.email })
        if (userExist) {
            throw new ConflictException("email already exists")
        }

        // hash password
        const hash = await HashPassword(registerDTO.password)

        // generate otp and otp expiry
        const otp = generateOTP()
        const otpExpiry = generateExpiryDate(5 * 60 * 1000)

        // prepare data
        const user = new User()

        user.name = registerDTO.name
        user.email = registerDTO.email
        user.password = hash
        user.agent = AGENT.local
        user.otp = otp
        user.otpExpiry = otpExpiry
        user.isVerified = false

        await Promise.all([
            // save into database
            userRepository.create(user),

            // send email
            sendMail({
                from: `MagicNova <${envConfig.nodemailerEmail}>`,
                to: registerDTO.email,
                subject: "Email Verification",
                html: `<p>Your OTP to verify registered email is <b>${otp}</b></p><p>This OTP will expire in 5 minutes</p>`
            })
        ])
    }

    async verifyEmail(verifyEmailDTO: VerifyEmailDTO) {
        // get user by email
        const user = await userRepository.findOne({ email: verifyEmailDTO.email })
        if (!user) {
            throw new NotFoundException("user not found")
        }

        // check if already verified
        if (user.isVerified) {
            throw new ConflictException("email is already verified")
        }

        // check otp
        if (verifyEmailDTO.otp !== user.otp) {
            throw new UnAuthorizedException("invalid otp")
        }

        // check otp expiry
        if (Number(user.otpExpiry) < Date.now()) {
            throw new ForbiddenException("expired otp")
        }

        // update user
        user.isVerified = true
        user.otp = ""
        user.otpExpiry = new Date()

        // save into database
        await userRepository.save(user)
    }

    async login(loginDTO: LoginDTO) {
        // check email existence
        const user = await userRepository.findOne({ email: loginDTO.email })
        if (!user) {
            throw new UnAuthorizedException("invalid credentials")
        }

        // verify password
        const isMatch = await VerifyPassword(loginDTO.password, user.password as string)
        if (!isMatch) {
            throw new UnAuthorizedException("invalid credentials")
        }

        // check verification
        if (!user.isVerified) {
            throw new UnAuthorizedException("please verify your email")
        }

        // generate token
        const payload = { _id: user._id, name: user.name, email: user.email }

        const token = generateToken(payload, { expiresIn: "7d" })

        // return token to controller
        return token
    }

    async resendOTP(resendOTPDTO: ResendOTPDTO) {
        // generate otp and otp expiry
        const otp = generateOTP()
        const otpExpiry = generateExpiryDate(5 * 60 * 1000)

        // get user by email and update
        const user = await userRepository.findOneAndUpdate({ email: resendOTPDTO.email }, { otp, otpExpiry })
        if (!user) {
            throw new NotFoundException("user not found")
        }

        // send email
        await sendMail({
            from: `MagicNova <${envConfig.nodemailerEmail}>`,
            to: resendOTPDTO.email,
            subject: "New OTP Sent",
            html: `<p>Your new OTP is <b>${otp}</b></p><p>This OTP will expire in 5 minutes</p>`
        })
    }

    async googleLogin(googleLoginDTO: GoogleLoginDTO) {
        // integrate google client
        const client = new OAuth2Client(envConfig.googleClientId)

        // verify idToken
        const ticket = await client.verifyIdToken({ idToken: googleLoginDTO.idToken })

        // get payload from ticket
        const payload = ticket.getPayload()

        if (!payload || !payload.email || !payload.name) {
            throw new BadRequestException("invalid google id token")
        }

        const { name, email } = payload

        // check user existence
        const user = await userRepository.findOne({ email })

        let userId = user?.id

        if (!user) {
            const createdUser = await userRepository.save({
                _id: userId as unknown as Types.ObjectId,
                name,
                email,
                password: null,
                agent: AGENT.google,
                isVerified: true
            })

            userId = createdUser._id as string
        }

        const localPayload: IJwtPayload = { _id: new Types.ObjectId(userId), name, email }

        // generate token
        const token = generateToken(localPayload, { expiresIn: "7d" })

        // return token to controller
        return token
    }

    async resetPassword(resetPasswordDTO: ResetPasswordDTO) {
        // check user existence
        const user = await userRepository.findOne({ email: resetPasswordDTO.email })
        if (!user) {
            throw new NotFoundException("user not found")
        }

        // check otp and otp expiry
        if (resetPasswordDTO.otp !== user.otp) {
            throw new UnAuthorizedException("invalid otp")
        }

        if (Number(user.otpExpiry) < Date.now()) {
            throw new ForbiddenException("expired otp")
        }

        // hash password
        const hash = await HashPassword(resetPasswordDTO.newPassword)

        // update user 
        user.password = hash
        user.otp = ""
        user.otpExpiry = new Date()

        // save into db
        await userRepository.save(user)
    }

    async getUserCreations(user: IUser) {
        // get user creations
        const creations = await creationRepository.find({ userId: user._id })

        // return creations
        return creations
    }

    async toggleLikeCreation(user: IUser, creationId: string) {
        // get creation
        const creation = await creationRepository.findById(creationId)
        if (!creation) {
            throw new NotFoundException("creation not found")
        }

        // check if creation is published
        if (!creation.publish) {
            throw new ForbiddenException("creation is not published")
        }

        // toggle like
        let message: string
        if (creation.likes.includes(user._id)) {
            const index = creation.likes.indexOf(user._id)
            creation.likes.splice(index, 1)
            message = "creation unliked successfully"
        } else {
            creation.likes.push(user._id)
            message = "creation liked successfully"
        }

        // save into db
        await creationRepository.save(creation)

        // return message
        return message
    }
}

export default new UserService()