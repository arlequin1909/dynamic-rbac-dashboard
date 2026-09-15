const _MESSAGE = "You don't have permission to view this section";

export function UnauthorizedNotice() {
  return <p className="text-sm text-red-400">{_MESSAGE}</p>;
}
