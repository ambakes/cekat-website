export function ECGWaveform() {
  return (
    <div className="checker-ecg" aria-hidden="true">
      <svg className="ecg-waveform" viewBox="0 0 720 80" width="720" height="80" preserveAspectRatio="none" fill="none" focusable="false">
        <path className="ecg-rest" d="M0 44H38l7-5 7 5h27l9 5 12-37 12 56 12-29 12 5h27l11-10 13 10h53 M240 44h38l7-5 7 5h27l9 5 12-37 12 56 12-29 12 5h27l11-10 13 10h53 M480 44h38l7-5 7 5h27l9 5 12-37 12 56 12-29 12 5h27l11-10 13 10h53" />
        <path className="ecg-trace" pathLength="100" d="M0 44H38l7-5 7 5h27l9 5 12-37 12 56 12-29 12 5h27l11-10 13 10h53 M240 44h38l7-5 7 5h27l9 5 12-37 12 56 12-29 12 5h27l11-10 13 10h53 M480 44h38l7-5 7 5h27l9 5 12-37 12 56 12-29 12 5h27l11-10 13 10h53" />
      </svg>
    </div>
  );
}
