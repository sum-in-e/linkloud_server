import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import morgan from 'morgan';
import LogzioWinstonTransport from 'winston-logzio';
import { ConfigService } from '@nestjs/config';
import { Injectable, LoggerService } from '@nestjs/common';
import dayjs from 'dayjs';

@Injectable()
export class CustomLogger {
  private logger: LoggerService;

  constructor(private configService: ConfigService) {
    const isProduction = this.configService.getOrThrow('MODE') === 'production';

    // * logz.io 설정
    const logzioTransport = new LogzioWinstonTransport({
      level: 'info',
      name: 'linkloud_log',
      token: this.configService.getOrThrow('LOGZIO_TOKEN'),
    });

    // * winston logger로 로그 생성하고 콘솔 출력 혹은 logz.io로 전송
    this.logger = WinstonModule.createLogger({
      format: winston.format.combine(
        // combine -> 여러 가지 포맷을 결합하여 로그 메시지의 최종 형태를 정의
        winston.format.colorize(),
        winston.format.timestamp({
          format: () => dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }),
        winston.format.json(),
      ),
      transports: isProduction
        ? [logzioTransport] // logz.io로 로그 전송
        : [new winston.transports.Console()], // 로컬에서는 콘솔만 찍히도록한다. (logz.io에 로그 전송하지 않음)
    });
  }

  // * 로그 레벨과 그에 따른 메서드 정의
  // 💡 로그 레벨은 로그의 중요도나 상세도를 나타내는 지표이다.
  log(context: string) {
    // info: 정보성 메세지 전달 - 앱 상태나 흐름 등 로깅
    this.logger.log('info', context);
  }

  error(context: string) {
    // error: 에러가 발생한 경우 - 예외 처리나 실패한 요청 로깅
    this.logger.log('error', context);
  }

  warn(context: string) {
    // warn: 경고가 발생한 경우 - 예상치 못한 상황이나 잠재적인 문제 로깅
    this.logger.log('warn', context);
  }

  debug(context: string) {
    // debug: 디버깅을 위한 메시지 전달하는 경우 - 변수의 값이나 함수의 결과 등을 로깅
    this.logger.log('debug', context);
  }

  verbose(context: string) {
    // verbose: 매우 상세한 메시지를 전달하는 경우 - 모든 요청과 응답의 내용 등을 로깅 -> 성능에 영향을 줄 수 있으니 주의해서 사용
    this.logger.log('verbose', context);
  }

  // * morgan 미들웨어 -> 전역에 적용하여 http 요청을 로깅
  createMorganMiddleware() {
    // 💡morgan은 단순히 http 요청과 응답의 정보를 포맷에 맞게 문자열로 변환하고, 스트림에 쓰는 역할만을 수행한다.
    // 💡morgan이 자체적으로 로그 레벨을 결정하지는 않는다. 따라서 morgan에서는 logger.log를 info 레벨로 호출한다.
    // 💡morgan은 http 요청과 응답에 대한 로깅을 목적으로 도입했으니 info레벨로 호출하고 에러 로깅은 winston에서 담당하게 하여 상황별로 로그 레벨을 지정하여 로깅되도록 한다.
    return morgan(
      (tokens, req, res) => {
        const method = tokens.method(req, res);
        const url = tokens.url(req, res);

        // method, url, and timestamp only
        return `[${method}] ${url}`;
      },
      {
        stream: {
          // winston에 http 로그 전달
          write: (context) => this.logger.log('info', context), // context 출력 예시 -> [POST] /api/link
        },
        skip: (req, res) => {
          if (
            res.statusCode >= 400 ||
            req.url?.startsWith('/docs') ||
            req.url?.startsWith('/swagger') ||
            req.url?.startsWith('/favicon')
          ) {
            return true;
          }
          return false;
        },
        // 스웨거 문서 관련 요청은 건너뜀
        // 400 이상의 응답은 건너뜀 -> 400이상은 예외 처리 상태 코드라서 httpExceptionFilter에서 직접 winston으로 로그를 생성하도록 할 것임. 따라서 margan에서 로그를 생성하면 중복 작업이 된다.
      },
    );
  }
}
