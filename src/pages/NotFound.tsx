import { useNavigate } from "react-router";
import FriendlyError from "@/components/error/FriendlyError";

/**
 * A missing page is still an error screen, so it gets the same treatment: the
 * purple buddy, plain language, a way home and the tiny game. No scary 404 dump.
 */
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <FriendlyError
      eyebrow="404 — lost little page"
      title="Oopsie — this page doesn't exist."
      text="The link may be old or mistyped, but nothing is broken and nothing was deleted. Head home and carry on."
      retryLabel="Take me home"
      onRetry={() => navigate("/")}
    />
  );
}
