const capitalizeFirstLetter = (inputString: string) => {
  if (typeof inputString !== "string" || inputString.length === 0) {
    return inputString;
  }

  return inputString.charAt(0).toUpperCase();
};

const truncateString = (
  inputString: string,
  prefixLength: number = 5,
  suffixLength: number = 5
) => {
  if (
    !inputString ||
    inputString.length === 0 ||
    inputString.length <= prefixLength + suffixLength
  ) {
    return inputString;
  }

  return `${inputString.slice(0, prefixLength)}...${inputString.slice(
    -suffixLength
  )}`;
};

export { capitalizeFirstLetter, truncateString };
