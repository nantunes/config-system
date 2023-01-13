export class OperationInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationInvalidError";
  }
}

export class ArgumentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgumentRequiredError";
  }
}
