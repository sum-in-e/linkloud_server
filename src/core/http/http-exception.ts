import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

interface HttpErrorOption {
  status?: number;
  // logging?: boolean;
}

// 💡HttpException은 부모클래스, CustomHttpException은 자식클래스. 자식 클래스와 부모 클래스의 관계는 extends 키워드로 알 수 있다.
// 💡자식 클래스? 부모 클래스를 상속받아서 새로운 클래스를 만드는 것. 부모 클래스의 속성과 메서드를 사용할 수 있고, 추가적으로 자신만의 속성과 메서드를 정의할 수 있다
export class CustomHttpException extends HttpException {
  public code: ResponseCode; // CustomHttpException에 code 속성 추가

  // constructor(responseCode: ResponseCode, message?: string, status?: HttpStatus) {
  constructor(responseCode: ResponseCode, message?: string, option?: HttpErrorOption) {
    // 💡super? 부모 클래스의 생성자나 메서드를 참조할 때 사용. 여기서는 부모클래스의 생성자를 호출하는 역할
    // 💡부모클래스인 HttpException은 첫 번째 매개변수로 응답 메세지를 받고 두 번째 매개변수로 응답 상태 코드를 받도록 정의되어있기때문에 super에 message와 status를 정의한다.
    // 💡그리고 super 아래 속성은 자식 클래스(CustomHttpException)에서만 정의하고 사용하는 속성이므로 자식 클래스의 인스턴스에만 존재한다.
    // super({ message: message || ResponseCode[responseCode], code: responseCode }, status || HttpStatus.BAD_REQUEST); // 생성자에서 초기화
    super(
      { code: responseCode, message: message || ResponseCode[responseCode] || ResponseCode.UNKNOWN_ERROR },
      option?.status || HttpStatus.BAD_REQUEST,
    );

    // code 속성에 responseCode를 할당 (생성자에서 초기화)
    this.code = responseCode;
  }
}
