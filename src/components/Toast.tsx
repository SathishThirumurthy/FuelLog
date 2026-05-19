interface Props {
  msg: string;
  isError: boolean;
  show: boolean;
}

export default function Toast({ msg, isError, show }: Props) {
  return (
    <div className={`toast${show ? ' show' : ''}${isError ? ' error' : ''}`}>
      {msg}
    </div>
  );
}
