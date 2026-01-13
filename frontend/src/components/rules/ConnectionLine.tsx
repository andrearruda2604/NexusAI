"use client";

interface ConnectionLineProps {
    direction?: "horizontal" | "vertical";
}

export default function ConnectionLine({ direction = "horizontal" }: ConnectionLineProps) {
    if (direction === "vertical") {
        return (
            <div className="flex flex-col items-center py-2">
                <div className="w-0.5 h-8 bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                <div className="w-0.5 h-8 bg-slate-300"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center px-2">
            <div className="h-0.5 w-8 bg-slate-300"></div>
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                />
            </svg>
            <div className="h-0.5 w-8 bg-slate-300"></div>
        </div>
    );
}
