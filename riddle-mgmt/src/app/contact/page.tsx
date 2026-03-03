import SwipeNav from "@/components/SwipeNav";

export default function Contact() {
  return (
    <SwipeNav leftTo={{ path: "/", label: "Home" }}>
    <div className="min-h-screen flex flex-col items-center justify-center sm:justify-start pt-0 sm:pt-32 pb-20 px-5 sm:px-8">
      <div className="max-w-md w-full text-center sm:text-left">
        <h1 className="text-2xl font-light tracking-tight animate-fade-in">
          Contact
        </h1>
        <div className="w-8 h-px bg-gray-200 mt-4 mb-10 animate-fade-in delay-100 mx-auto sm:mx-0" />

        <p className="text-sm text-gray-500 font-light mb-10 animate-fade-in delay-200">
          For inquiries regarding management or general business.
        </p>

        <div className="animate-fade-in delay-300">
          <p className="text-xs text-gray-400 tracking-wide">
            Reach out directly at
          </p>
          <a
            href="mailto:team@riddlellc.biz"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-300 font-light mt-2 inline-block"
          >
            team@riddlellc.biz
          </a>
        </div>
      </div>
    </div>
    </SwipeNav>
  );
}
