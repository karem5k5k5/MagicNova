import { WandSparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
    const navigate = useNavigate();
    return (
        <footer className="w-full bg-linear-to-b from-[#F1EAFF] to-[#FFFFFF] text-gray-800">
            <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center">
                <div className="flex items-center space-x-3 mb-6">
                    <p className="flex items-center gap-2 text-primary text-4xl font-bold" >MagicNova <WandSparkles className="w-9 h-9 text-primary" /></p>
                </div>
                <p className="text-center max-w-xl text-sm font-normal leading-relaxed">
                    Experience the power of AI with GenAI.<br /> Transform your content creation with our suite of integrated AI tools. Write Articles, generate images and enhance your workflow.
                </p>
            </div>
            <div className="border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm font-normal">
                    Copyright {new Date().getFullYear()} © Kareem Mohamed. All Right Reserved.
                </div>
            </div>
        </footer>
    )
}

export default Footer