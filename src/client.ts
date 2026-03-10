import * as cheerio from 'cheerio';

export interface CommandInfo {
  name: string;
  path: string;
  description?: string;
}

export interface Category {
  name: string;
  commands: CommandInfo[];
}

export interface CommandDetail {
  name: string;
  syntax: string[];
  description: string;
  parameters: { name: string; description: string }[];
  defaultValue?: string;
  examples: string[];
}

export class YamahaDocClient {
  private readonly baseUrl = 'https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/';
  private cache = new Map<string, string>();

  private async fetchHtml(path: string): Promise<string> {
    const url = this.baseUrl + path;
    const cached = this.cache.get(url);
    if (cached) return cached;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    this.cache.set(url, html);
    return html;
  }

  async listCategoriesAndCommands(): Promise<Category[]> {
    const html = await this.fetchHtml('toc.html');
    const $ = cheerio.load(html);
    const categories: Category[] = [];

    // Chapters are top-level li with class chapter
    $('li.chapter').each((_, elem) => {
      const chapterLink = $(elem).find('> a');
      const categoryName = chapterLink.text().trim();
      
      const commands: CommandInfo[] = [];
      // Find all nested topicref links
      $(elem).find('li.topicref a').each((_, a) => {
        const name = $(a).text().trim();
        const href = $(a).attr('href');
        
        if (name && href && !href.endsWith('_chapter.html') && href !== chapterLink.attr('href')) {
          commands.push({ name, path: href });
        }
      });

      if (commands.length > 0) {
        const cleanName = categoryName.replace(/^\d+\.\s*/, '');
        categories.push({ name: cleanName, commands });
      }
    });

    return categories;
  }

  async getCommandDetail(path: string): Promise<CommandDetail | null> {
    const html = await this.fetchHtml(path);
    const $ = cheerio.load(html);

    const name = $('h1.title').first().text().trim() || path;
    const detail: CommandDetail = {
      name,
      syntax: [],
      description: '',
      parameters: [],
      examples: [],
    };

    // Yamaha DITA structure
    $('div.section').each((_, section) => {
      const title = $(section).find('h2.sectiontitle').text().trim();
      
      if (title.includes('書式')) {
        $(section).find('li.sli, .pre.codeblock').each((_, elem) => {
          detail.syntax.push($(elem).text().trim());
        });
      } else if (title.includes('説明')) {
        detail.description = $(section).find('p, div').not('h2').text().trim();
      } else if (title.includes('設定値') || title.includes('パラメータ')) {
        // If the title also contains '初期値' (Default), we might want to capture it
        if (title.includes('初期値')) {
          detail.defaultValue = $(section).find('li.li:contains("初期値"), p:contains("初期値")').text().trim();
        }
        
        $(section).find('li.li').each((_, li) => {
          const paramName = $(li).find('.keyword.varname, b').first().text().trim();
          const paramDesc = $(li).text().replace(paramName, '').trim();
          if (paramName) {
            detail.parameters.push({ name: paramName, description: paramDesc });
          }
        });
      } else if (title.includes('初期値')) {
        detail.defaultValue = $(section).text().replace(title, '').trim();
      } else if (title.includes('例')) {
        $(section).find('.pre.codeblock').each((_, pre) => {
          detail.examples.push($(pre).text().trim());
        });
      }
    });

    return detail;
  }
}
