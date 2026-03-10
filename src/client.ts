import * as cheerio from 'cheerio';

export interface CommandInfo {
  command: string;
  description: string;
}

export interface Category {
  name: string;
  commands: CommandInfo[];
}

export interface CommandDetail {
  command: string;
  syntax: string[];
  description: string;
  parameters: { name: string; description: string }[];
  defaultValue?: string;
  notes: string[];
  examples: string[];
  applicableModels: string[];
}

export class YamahaDocClient {
  private readonly baseUrl = 'https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/';
  private cache = new Map<string, string>();
  // Internal mapping of command name to HTML path
  private commandToPathMap = new Map<string, string>();
  // Internal mapping of HTML path to exact command name
  private pathToCommandMap = new Map<string, string>();

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

  /**
   * Builds the internal bidirectional mapping between command strings and HTML paths.
   */
  async buildCommandIndex(): Promise<void> {
    if (this.commandToPathMap.size > 0) return;

    const html = await this.fetchHtml('cmdref_index.html');
    const $ = cheerio.load(html);

    $('li a').each((_, a) => {
      const command = $(a).text().trim();
      const href = $(a).attr('href');
      if (command && href) {
        this.commandToPathMap.set(command.toLowerCase(), href);
        this.pathToCommandMap.set(href, command);
      }
    });
  }

  async listCategoriesAndCommands(): Promise<Category[]> {
    await this.buildCommandIndex();

    const html = await this.fetchHtml('toc.html');
    const $ = cheerio.load(html);
    const categories: Category[] = [];

    $('li.chapter').each((_, elem) => {
      const chapterLink = $(elem).find('> a');
      const categoryName = chapterLink.text().trim();
      
      const commands: CommandInfo[] = [];
      $(elem).find('li.topicref a').each((_, a) => {
        const descriptiveName = $(a).text().trim();
        const href = $(a).attr('href');
        
        if (href && !href.endsWith('_chapter.html') && href !== chapterLink.attr('href')) {
          const exactCommand = this.pathToCommandMap.get(href) ?? descriptiveName;
          commands.push({ 
            command: exactCommand, 
            description: descriptiveName.replace(/^\d+(\.\d+)*\s*/, '') // Clean numbering
          });
        }
      });

      if (commands.length > 0) {
        categories.push({ 
          name: categoryName.replace(/^\d+\.\s*/, ''), 
          commands 
        });
      }
    });

    return categories;
  }

  async resolveCommandPath(query: string): Promise<string | null> {
    await this.buildCommandIndex();
    const normalizedQuery = query.toLowerCase().trim();
    
    // 1. Exact match
    const path = this.commandToPathMap.get(normalizedQuery);
    if (path) return path;

    // 2. Fallback to searching keys
    for (const [cmd, p] of this.commandToPathMap.entries()) {
      if (cmd.startsWith(normalizedQuery)) return p;
    }

    return null;
  }

  async getCommandDetail(path: string): Promise<CommandDetail | null> {
    const html = await this.fetchHtml(path);
    const $ = cheerio.load(html);

    const commandName = this.pathToCommandMap.get(path) ?? $('h1.title').first().text().trim() ?? path;
    const detail: CommandDetail = {
      command: commandName,
      syntax: [],
      description: '',
      parameters: [],
      notes: [],
      examples: [],
      applicableModels: [],
    };

    $('div.section').each((_, section) => {
      const title = $(section).find('h2.sectiontitle').text().trim();
      
      if (title.includes('書式')) {
        $(section).find('li.sli, .pre.codeblock').each((_, elem) => {
          detail.syntax.push($(elem).text().trim());
        });
      } else if (title.includes('説明')) {
        detail.description = $(section).find('p, div').not('h2').text().trim();
      } else if (title.includes('設定値') || title.includes('パラメータ')) {
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
      } else if (title.includes('ノート')) {
        $(section).find('p, li.li, span.ph, div').not('h2').each((_, elem) => {
          const text = $(elem).text().trim();
          if (text) detail.notes.push(text);
        });
      } else if (title.includes('例')) {
        $(section).find('.pre.codeblock').each((_, pre) => {
          detail.examples.push($(pre).text().trim());
        });
      } else if (title.includes('適用モデル')) {
        $(section).find('p, li.li, span.ph, div').not('h2').each((_, elem) => {
          const text = $(elem).text().trim();
          if (text) detail.applicableModels.push(text);
        });
      }
    });

    return detail;
  }
}
