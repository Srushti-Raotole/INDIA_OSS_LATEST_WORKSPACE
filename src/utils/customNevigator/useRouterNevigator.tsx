import { useNavigate } from "react-router-dom";

const useRouteNavigator = () => {
    const navigate = useNavigate();

    const goTo = (path: string, options?: { replace?: boolean }) => {
        if (path !== "/login") {
            sessionStorage.setItem("lastVisitedRoute", path);
        }
        navigate(path, options);
    };

    return { goTo };
};

export default useRouteNavigator;
