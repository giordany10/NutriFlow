# NutriFlow — demonstração local

Abra `index.html` no navegador. Não precisa instalar Node.js, configurar Firebase nem conectar Google Planilhas.

## Contas de demonstração

Há contas fictícias de nutricionista e paciente para testar o painel e o portal. As credenciais não são exibidas na tela de login. Como este protótipo funciona inteiramente no navegador, os dados de conta definidos no JavaScript podem ser inspecionados por quem acessar os arquivos; não são credenciais seguras.

## Cadastro e acesso do paciente

Na tela de login, escolha **Criar conta de paciente**. O paciente pode informar nome, e-mail, data de nascimento, altura, peso, objetivo, alergias/restrições e senha. A lista do nutricionista mostra a idade e permite filtrar pacientes por faixa etária. Altura e peso também podem ser atualizados no portal e aparecem no cadastro do nutricionista.

No portal, o paciente pode ver o plano alimentar com refeições, horários, calorias e nutrientes estimados por refeição e o total dos alimentos cadastrados, além da meta de água definida pelo nutricionista. Os planos exibem a distribuição estimada dos macronutrientes em gráfico e os alimentos em uma tabela com quantidade, proteínas, carboidratos, lipídios e calorias. O total considera alimentos e porções cadastrados; orientações em texto livre não entram no cálculo. O paciente também pode anotar o que comeu com valores estimados de carboidratos, proteínas e gorduras e enviar dúvidas. A meta de água é definida individualmente pelo nutricionista; o sistema não a estima pelo peso. O nutricionista organiza café da manhã, lanches, almoço, jantar e ceia no formulário do plano; horários e refeições são opcionais conforme a necessidade individual. A busca de alimentos está organizada por categoria e possui filtro por nome. O formulário inclui uma pequena amostra demonstrativa de alimentos atribuídos à TACO e permite adicionar alimentos personalizados com os valores por 100 g; os alimentos personalizados ficam salvos na lista local do nutricionista. A amostra não é a tabela TACO completa, não inclui vitaminas e não inclui dados da tabela Tucunduva; confira os valores de referência antes de usar em orientações. Na seção **Antropometria**, o nutricionista registra avaliações datadas de peso, altura e circunferências de cintura, quadril e braço, consulta o histórico e o IMC descritivo. Para menores de 18 anos, a interpretação do IMC exige referências específicas por idade e sexo; o sistema não classifica nem diagnostica. Na seção **Dúvidas dos pacientes**, pode responder e a resposta aparece no portal. Os registros aparecem no relatório, que permite filtrar por paciente e mostra a distribuição estimada de energia dos macronutrientes (4 kcal/g para carboidratos e proteínas, 9 kcal/g para gorduras), além dos totais em gramas. Isso não define uma meta ou proporção ideal.

O nutricionista fictício tem acesso ao painel, pacientes, planos, agenda demonstrativa, receitas, relatórios e administração da demonstração.

## Limitações importantes

Esta versão é um protótipo funcional local: usuários, senhas, pacientes e planos ficam no armazenamento local do navegador. Não existe servidor nem sincronização com outros computadores; quem tem acesso ao mesmo navegador pode inspecionar os dados. Limpar os dados do navegador apaga os cadastros.

Os registros alimentares, planos e dúvidas/respostas também ficam apenas no armazenamento local do navegador e podem ser acessados em outra aba que use o mesmo armazenamento. Eles não são enviados por e-mail nem sincronizados entre dispositivos ou navegadores. Para que paciente e nutricionista troquem dados em dispositivos diferentes, será necessário implementar um backend seguro ou integrar um serviço de armazenamento.

**Não use dados reais, informações de saúde ou senhas pessoais neste protótipo.** Para disponibilizar login e cadastro reais pela internet com privacidade e acesso em vários dispositivos, será necessário conectar um backend seguro. A integração com Google Planilhas pode ser feita depois, conforme solicitado.
