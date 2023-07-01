import axios from 'axios';
import { Parser } from 'htmlparser2';
import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { URL } from 'url';

@Injectable()
export class LinkAnalyzeService {
  async linkAnalyze(url: string) {
    if (!this.isValidUrl(url)) {
      throw new CustomHttpException(ResponseCode.INVALID_URL, `유효하지 않은 형식의 링크입니다.`);
    }

    // Get HTML and parse metadata
    const meta = await this.parseMeta(url);

    const urlObj = new URL(url);
    const urlWithoutQuery = urlObj.origin + urlObj.pathname;

    const result = {
      url,
      title: meta['og:title'] || urlWithoutQuery,
      thumbnailUrl:
        meta['og:image'] ||
        'https://res.cloudinary.com/dqcgvbbv7/image/upload/v1688032357/linkloud/linkloud_thumbnail_cp3joj.png',
      description: meta['og:description'] || urlWithoutQuery,
    };

    return result;
  }

  private isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async parseMeta(url: string): Promise<Record<string, string>> {
    try {
      const response = await axios.get(url);
      const html = response.data;

      return new Promise((resolve) => {
        const meta: Record<string, string> = {};
        let isInMetaTag = false;
        let currentMetaName = '';

        const parser = new Parser({
          onopentagname(name) {
            if (name === 'meta') {
              isInMetaTag = true;
            }
          },
          onattribute(name, value) {
            if (isInMetaTag && (name === 'name' || name === 'property')) {
              currentMetaName = value;
            } else if (isInMetaTag && name === 'content') {
              meta[currentMetaName] = value;
            }
          },
          onclosetag(name) {
            if (name === 'meta') {
              isInMetaTag = false;
            }
          },
          onend() {
            resolve(meta);
          },
        });

        parser.write(html);
        parser.end();
      });
    } catch (error) {
      throw new CustomHttpException(ResponseCode.INVALID_URL, `정보를 가져올 수 없는 링크입니다. 다시 시도해 주세요.`);
    }
  }
}
