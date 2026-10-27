"""Small HTML table reader for public leaderboard pages."""
from html.parser import HTMLParser

class Tables(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self.times = [], []
        self.table = self.row = self.cell = self.inline = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'time' and attrs.get('datetime'):
            self.times.append(attrs['datetime'])
        elif tag == 'table' and self.table is None:
            self.table = {'id': attrs.get('id'), 'rows': []}
        elif self.table is not None and tag == 'tr':
            self.row = []
        elif self.row is not None and tag in ('th', 'td'):
            self.cell = {'parts': [], 'links': [], 'strongs': [], 'smalls': []}
        elif self.cell is not None and tag == 'a' and attrs.get('href'):
            self.cell['links'].append(attrs['href'])
        elif self.cell is not None and tag in ('strong', 'small') and self.inline is None:
            self.inline = {'tag': tag, 'parts': []}

    def handle_data(self, data):
        if self.cell is not None:
            self.cell['parts'].append(data)
            if self.inline is not None:
                self.inline['parts'].append(data)

    def handle_endtag(self, tag):
        if self.inline is not None and tag == self.inline['tag']:
            self.cell[self.inline['tag'] + 's'].append(' '.join(''.join(self.inline['parts']).split()))
            self.inline = None
        elif tag in ('th', 'td') and self.cell is not None:
            self.row.append({'text': ' '.join(''.join(self.cell['parts']).split()), 'links': self.cell['links'], 'strongs': self.cell['strongs'], 'smalls': self.cell['smalls']})
            self.cell = None
            self.inline = None
        elif tag == 'tr' and self.row is not None:
            self.table['rows'].append(self.row)
            self.row = None
        elif tag == 'table' and self.table is not None:
            self.tables.append(self.table)
            self.table = None
