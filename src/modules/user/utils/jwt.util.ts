import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtUtil {
  /**
   * @remarks JWT 토큰을 디코딩하는 메서드
   * @param token - JWT token
   * @returns headerJson, payloadJson
   */
  async decodeJWT(token: string) {
    // id_token을 점(.)으로 구분하여 헤더, 페이로드, 서명으로 나눔
    const [header, payload, signature] = token.split('.');

    // 헤더와 페이로드를 Base64 디코딩하여 JSON 형식의 데이터로 변환
    const headerJson = JSON.parse(Buffer.from(header, 'base64').toString());
    const payloadJson = JSON.parse(Buffer.from(payload, 'base64').toString());

    return {
      headerJson,
      payloadJson,
    };
  }
}
