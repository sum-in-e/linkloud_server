import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';
import { URL } from 'url';
import { thumbnailUrl } from 'src/modules/link/constants/guide-links.constant';
import getMetaData from 'metadata-scraper';

@Injectable()
export class LinkAnalyzeService {
  async linkAnalyze(url: string) {
    if (!this.isValidUrl(url)) {
      throw new CustomHttpException(ResponseCode.INVALID_URL, `유효하지 않은 형식의 링크입니다.`);
    }

    const urlObj = new URL(url);
    const urlWithoutQuery = urlObj.origin + urlObj.pathname;

    try {
      const { title, description, image } = await getMetaData(url, { timeout: 3000 });

      const result = {
        url,
        title: title || urlWithoutQuery,
        description: description || urlWithoutQuery,
        thumbnailUrl: image || thumbnailUrl,
      };

      return result;
    } catch (error) {
      const result = {
        url,
        title: urlWithoutQuery,
        thumbnailUrl: thumbnailUrl,
        description: urlWithoutQuery,
      };

      return result;
    }
  }

  private isValidUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}
