import axios from 'axios';
import { Parser } from 'htmlparser2';
import { Injectable } from '@nestjs/common';
import { CustomHttpException } from 'src/core/http/http-exception';
import { ResponseCode } from 'src/core/http/types/http-response-code.enum';

@Injectable()
export class LinkService {
  async linkAnalyze(url: string) {
    if (!this.isValidUrl(url)) {
      throw new CustomHttpException(ResponseCode.INVALID_URL, `"${url}" is not a valid url`);
    }

    // Get HTML and parse metadata
    const meta = await this.parseMeta(url);

    const result = {
      url,
      title: meta['og:title'] || url,
      thumbnailUrl: meta['og:image'] || null,
      description: meta['og:description'] || url,
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
      throw new CustomHttpException(ResponseCode.INVALID_URL);
    }
  }
}
