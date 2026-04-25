import * as cheerio from 'cheerio';

type CheerioAPI = ReturnType<typeof cheerio.load>;
type CheerioCollection = ReturnType<CheerioAPI>;

export interface CommandInfo {
  command: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  subCategories: Category[];
  commands: CommandInfo[];
}

export interface CommandDetail {
  command: string;
  aliases?: string[];
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
  private commandToPathMap = new Map<string, string>();
  private pathToCommandsMap = new Map<string, string[]>();
  private tocTree: Category[] | null = null;

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

  async buildCommandIndex(): Promise<void> {
    if (this.commandToPathMap.size > 0) return;

    const html = await this.fetchHtml('cmdref_index.html');
    const $ = cheerio.load(html);

    $('li a').each((_, a) => {
      const command = $(a).text().trim();
      const href = $(a).attr('href');
      if (command && href) {
        this.commandToPathMap.set(command.toLowerCase(), href);
        const aliases = this.pathToCommandsMap.get(href) ?? [];
        aliases.push(command);
        this.pathToCommandsMap.set(href, aliases);
      }
    });
  }

  /**
   * Helper to clean names (remove numbering and trailing garbage)
   */
  private cleanName(name: string): string {
    return name.replace(/^\d+(\.\d+)*\s*/, '').trim();
  }

  private async buildTocTree(): Promise<Category[]> {
    await this.buildCommandIndex();
    if (this.tocTree) return this.tocTree;
    const html = await this.fetchHtml('toc.html');
    const $ = cheerio.load(html);
    const rootLis = $('ul.map.bookmap').first().children('li');
    const rootCategories: Category[] = [];

    rootLis.each((_, li) => {
      const node = this.parseTocNode($, $(li));
      if (node) rootCategories.push(node);
    });

    this.tocTree = rootCategories;
    return rootCategories;
  }

  private parseTocNode($: CheerioAPI, li: CheerioCollection): Category | null {
    const link = li.children('a').first();
    const rawName = link.text();
    const name = this.cleanName(rawName);
    const href = link.attr('href');
    const id = href ?? name;
    const subCategories: Category[] = [];
    const commands: CommandInfo[] = [];

    const childLis = li.children('ul').children('li');
    childLis.each((_, child) => {
      const childLi = $(child);
      const childLink = childLi.children('a').first();
      const childNameRaw = childLink.text();
      const childName = this.cleanName(childNameRaw);
      const childHref = childLink.attr('href');

      if (childHref && this.pathToCommandsMap.has(childHref)) {
        const exactCommands = this.pathToCommandsMap.get(childHref)!;
        for (const exactCommand of exactCommands) {
          commands.push({ command: exactCommand, description: childName });
        }
      } else if (childName) {
        const childNode = this.parseTocNode($, childLi);
        if (childNode) subCategories.push(childNode);
      }
    });

    if (!name) return null;
    return { id, name, subCategories, commands };
  }

  private findCategoryById(nodes: Category[], id: string): Category | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = this.findCategoryById(node.subCategories, id);
      if (found) return found;
    }
    return null;
  }

  private findCategoryByName(nodes: Category[], name: string): Category | null {
    for (const node of nodes) {
      if (node.name === name) return node;
      const found = this.findCategoryByName(node.subCategories, name);
      if (found) return found;
    }
    return null;
  }

  async listCategories(parentId?: string): Promise<Category[]> {
    const tree = await this.buildTocTree();
    if (!parentId) return tree;
    const node = this.findCategoryById(tree, parentId) ?? this.findCategoryByName(tree, parentId);
    if (!node) return [];
    return node.subCategories;
  }

  private collectCommands(node: Category, acc: CommandInfo[]): void {
    acc.push(...node.commands);
    for (const child of node.subCategories) {
      this.collectCommands(child, acc);
    }
  }

  async listAllCategoriesAndCommands(): Promise<Category[]> {
    return this.buildTocTree();
  }

  async listCommandsByCategory(categoryId: string): Promise<CommandInfo[]> {
    const tree = await this.buildTocTree();
    const node = this.findCategoryById(tree, categoryId) ?? this.findCategoryByName(tree, categoryId);
    if (!node) return [];
    const commands: CommandInfo[] = [];
    this.collectCommands(node, commands);
    return commands;
  }

  async resolveCommandPath(query: string): Promise<string | null> {
    await this.buildCommandIndex();
    const normalizedQuery = query.toLowerCase().trim();
    
    const path = this.commandToPathMap.get(normalizedQuery);
    if (path) return path;

    for (const [cmd, p] of this.commandToPathMap.entries()) {
      if (cmd.startsWith(normalizedQuery)) return p;
    }

    return null;
  }

  async getCommandDetail(path: string, preferredCommand?: string): Promise<CommandDetail | null> {
    const html = await this.fetchHtml(path);
    const $ = cheerio.load(html);

    const aliases = this.pathToCommandsMap.get(path) ?? [];
    const preferredAlias = preferredCommand
      ? aliases.find(alias => alias.toLowerCase() === preferredCommand.toLowerCase().trim())
      : undefined;
    const commandName = preferredAlias ?? aliases[0] ?? $('h1.title').first().text().trim() ?? path;
    const detail: CommandDetail = {
      command: commandName,
      aliases,
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
