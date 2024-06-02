import { useEffect, useState } from "react";

export function useHydrationFix() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    return loading;
}