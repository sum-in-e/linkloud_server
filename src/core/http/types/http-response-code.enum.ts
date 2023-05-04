export enum ResponseCode {
  // 정상
  OK = 'OK',

  // -------------------- 에러 응답 코드 --------------------

  // REQUEST 데이터 관련 에러
  REQUEST_INVALID_PARAM = 'REQUEST_INVALID_PARAM',

  // USER 관련 에러
  EMAIL_ALREADY_EXIST = 'EMAIL_ALREADY_EXIST', // 이미 가입된 이메일
  NOT_VERIFIED_EMAIL = 'NOT_VERIFIED_EMAIL', // 인증되지 않은 이메일
  FAILED_TO_SEND_EMAIL = 'FAILED_TO_SEND_EMAIL', // Sendgrid로 이메일 전송 실패
  EMAIL_CODE_MISMATCH = 'EMAIL_CODE_MISMATCH', // 이메일 인증 번호 불일치
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT', // 이메일 형식 이상
  INVALID_NAME_FORMAT = 'INVALID_NAME_FORMAT', // 닉네임 형식 이상
  INVALID_PASSWORD_FORMAT = 'INVALID_PASSWORD_FORMAT', // 비밀번호 형식 이상
  TERMS_NOT_AGREED = 'TERMS_NOT_AGREED', // 약관 동의 안 함

  // AUTH 관련 에러

  // 외부 서비스 API KEY 에러
  SENDGRID_API_KEY_NOT_FOUND = 'SENDGRID_API_KEY_NOT_FOUND',

  //404 에러
  NOT_FOUND = 'NOT_FOUND',

  // 500 에러
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  // UNKNOWN 에러
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
