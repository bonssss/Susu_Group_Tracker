import { SusuError } from "../domain/susu-group.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof SusuError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof TypeError || error instanceof RangeError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "Request body must contain valid JSON." });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
}
